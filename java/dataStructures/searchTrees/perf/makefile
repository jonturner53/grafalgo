IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-util.a ${LDIR}/lib-ds.a

CXXFLAGS = -O2 -m64 

.cpp.o :
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : evalTreeMap evalSaTreeMap

evalTreeMap: evalTreeMap.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

evalSaTreeMap: evalSaTreeMap.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o
