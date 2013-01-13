IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64 

%.o : %.cpp
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : testDheap testDheapSet testFheapSet testLheapSet

testDheap: testDheap.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testDheapSet: testDheapSet.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testFheapSet: testFheapSet.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testLheapSet: testLheapSet.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o
