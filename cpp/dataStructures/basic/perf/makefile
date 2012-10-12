IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-util.a ${LDIR}/lib-ds.a

CXXFLAGS = -m64 

%.o : %.cpp
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : perfUiDlist perfStlList perfStlSet perfHashMap histHashMap

perfUiDlist: perfUiDlist.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

perfStlList: perfStlList.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

perfStlSet: perfStlSet.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

perfHashMap: perfHashMap.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

histHashMap: histHashMap.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o
